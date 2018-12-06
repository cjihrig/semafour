#include "semafour.h"

using v8::Boolean;
using v8::Context;
using v8::Exception;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Uint32;
using v8::Value;

Persistent<Function> Semafour::constructor;

#define THROW(type, msg)                                                      \
  (isolate->ThrowException(Exception::type(String::NewFromUtf8(isolate, msg))))

#define THROW_UV(err, fn_name)                                                \
  (isolate->ThrowException(node::UVException(isolate, err, fn_name)))

#define UNWRAP(type) (ObjectWrap::Unwrap<type>(args.Holder()))


static int copy_name(char* dest, const char* src) {
  size_t len = strlen(src);

  if (len >= SEM_NAME_MAX_LEN) {
    return UV_ENOBUFS;
  }

  memcpy(dest, src, len + 1);
  return 0;
}


Semafour::Semafour(const char* name, uint32_t value, bool create, int* err) {
  int flags = O_CREAT;
  int r = copy_name(_name, name);

  if (r != 0) {
    *err = r;
    return;
  }

  if (create == true) {
    flags |= O_EXCL;
  }

  _sem = sem_open(_name, flags, 0644, value);

  if (_sem == SEM_FAILED) {
    *err = -errno;
  } else {
    *err = 0;
  }
}


Semafour::~Semafour() {
  Unlink();
}


int Semafour::Post() {
  if (sem_post(_sem) != 0) {
    return -errno;
  }

  return 0;
}


int Semafour::Wait() {
  int r;

  do {
    r = sem_wait(_sem);
  } while (r == -1 && errno == EINTR);

  if (r != 0) {
    return -errno;
  }

  return 0;
}


int Semafour::Unlink() {
  if (sem_unlink(_name) != 0) {
    // Try to unify the error that is returned.
    if (-errno == UV_ENOENT) {
      return UV_EINVAL;
    }

    return -errno;
  }

  return 0;
}


int Semafour::Close() {
  if (sem_close(_sem) != 0) {
    return -errno;
  }

  return 0;
}


void Semafour::New(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (!args.IsConstructCall()) {
    THROW(Error, "Semafour must be constructed using new");
    return;
  } else if (!args[0]->IsString()) {
    THROW(TypeError, "name must be a string");
    return;
  } else if (!args[1]->IsUint32()) {
    THROW(TypeError, "value must be an unsigned integer");
    return;
  } else if (!args[2]->IsBoolean()) {
    THROW(TypeError, "create must be a boolean");
    return;
  }

  String::Utf8Value str(args[0]);
  const char* name = *str;
  uint32_t value = args[1].As<Uint32>()->Value();
  bool create = args[2].As<Boolean>()->Value();
  int r = 0;
  Semafour* sem = new Semafour(name, value, create, &r);

  if (r != 0) {
    THROW_UV(r, "sem_open");
    return;
  }

  sem->Wrap(args.This());
  args.GetReturnValue().Set(args.This());
}


void Semafour::Post(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Semafour* sem = UNWRAP(Semafour);
  int r = sem->Post();

  if (r != 0) {
    args.GetReturnValue().Set(node::UVException(isolate, r, "sem_post"));
  } else {
    args.GetReturnValue().Set(Null(isolate));
  }
}


static void WaitWork(uv_work_t* req) {
  async_req* request = reinterpret_cast<async_req*>(req->data);

  request->result = request->sem->Wait();
}


static void AfterWait(uv_work_t* req, int status) {
  async_req* request = reinterpret_cast<async_req*>(req->data);
  Isolate* isolate = request->isolate;
  v8::HandleScope scope(isolate);
  Local<Object> recv = request->sem->handle(isolate);
  Local<Function> callback = Local<Function>::New(isolate, request->callback);
  const unsigned argc = 1;
  Local<Value> argv[argc] = {};

  if (request->result == 0) {
    argv[0] = Null(isolate);
  } else {
    argv[0] = node::UVException(isolate, request->result, "sem_wait");
  }

  node::MakeCallback(isolate,
                     recv,
                     callback,
                     argc,
                     argv);
  request->callback.Reset();
  delete req;
}


void Semafour::Wait(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Semafour* sem = UNWRAP(Semafour);
  Isolate* isolate = args.GetIsolate();
  int r;

  if (args.Length() == 0) {
    // Handle synchronous case.
    r = sem->Wait();

    if (r != 0) {
      THROW_UV(r, "sem_wait");
    }

    return;
  } else if (!args[0]->IsFunction()) {
    THROW(TypeError, "callback must be a function");
    return;
  }

  Local<Function> callback = Local<Function>::Cast(args[0]);
  async_req* req = new async_req;

  req->sem = sem;
  req->isolate = isolate;
  req->callback.Reset(isolate, callback);
  req->req.data = req;

  r = uv_queue_work(uv_default_loop(),
                    &req->req,
                    WaitWork,
                    (uv_after_work_cb) AfterWait);

  if (r != 0) {
    abort();
  }
}


void Semafour::Unlink(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Semafour* sem = UNWRAP(Semafour);
  int r = sem->Unlink();

  if (r != 0) {
    args.GetReturnValue().Set(node::UVException(isolate, r, "sem_unlink"));
  } else {
    args.GetReturnValue().Set(Null(isolate));
  }
}


void Semafour::Close(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Semafour* sem = UNWRAP(Semafour);
  int r = sem->Close();

  if (r != 0) {
    args.GetReturnValue().Set(node::UVException(r, "sem_close"));
  } else {
    args.GetReturnValue().Set(Null(isolate));
  }
}


void Semafour::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "Semafour"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "post", Post);
  NODE_SET_PROTOTYPE_METHOD(tpl, "wait", Wait);
  NODE_SET_PROTOTYPE_METHOD(tpl, "unlink", Unlink);
  NODE_SET_PROTOTYPE_METHOD(tpl, "close", Close);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "Semafour"),
               tpl->GetFunction());
}
