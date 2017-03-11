#include "semafour.h"

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
using v8::Value;

Persistent<Function> Semafour::constructor;


#define THROW(type, msg)                                                      \
  (isolate->ThrowException(Exception::type(String::NewFromUtf8(isolate, msg))))

#define UNWRAP(type) (ObjectWrap::Unwrap<type>(args.Holder()))


Semafour::Semafour(uint32_t value) {
  if (uv_sem_init(&_sem, value) != 0) {
    abort();
  }
}


Semafour::~Semafour() {
  uv_sem_destroy(&_sem);
}


void Semafour::Post() {
  uv_sem_post(&_sem);
}


void Semafour::Wait() {
  uv_sem_wait(&_sem);
}


void Semafour::New(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (!args.IsConstructCall()) {
    THROW(Error, "Semafour must be constructed using new");
    return;
  }

  uint32_t value = 0;

  if (args[0]->IsUint32()) {
    value = args[0]->Uint32Value();
  } else if (!args[0]->IsUndefined()) {
    THROW(TypeError, "value must be an unsigned integer");
    return;
  }

  Semafour* sem = new Semafour(value);
  sem->Wrap(args.This());
  args.GetReturnValue().Set(args.This());
}


void Semafour::Post(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Semafour* sem = UNWRAP(Semafour);

  sem->Post();
}


static void WaitWork(uv_work_t* req) {
  async_req* request = reinterpret_cast<async_req*>(req->data);

  request->sem->Wait();
}


static void AfterWait(uv_work_t* req, int status) {
  async_req* request = reinterpret_cast<async_req*>(req->data);
  Isolate* isolate = request->isolate;
  v8::HandleScope scope(isolate);
  Local<Function> callback = Local<Function>::New(isolate, request->callback);
  const unsigned argc = 0;
  Local<Value> argv[argc] = {};

  callback->Call(Null(request->isolate), argc, argv);
  request->callback.Reset();
  delete req;
}


void Semafour::Wait(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Semafour* sem = UNWRAP(Semafour);
  Isolate* isolate = args.GetIsolate();

  // Handle synchronous case.
  if (args.Length() == 0) {
    sem->Wait();
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

  int r = uv_queue_work(uv_default_loop(),
                        &req->req,
                        WaitWork,
                        (uv_after_work_cb) AfterWait);

  if (r != 0) {
    abort();
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

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "Semafour"),
               tpl->GetFunction());
}
