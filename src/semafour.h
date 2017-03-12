#ifndef _SEMAFOUR_H_
#define _SEMAFOUR_H_

#include <fcntl.h>
#include <limits.h>
#include <semaphore.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <node.h>
#include <node_object_wrap.h>
#include <uv.h>

#define SEM_NAME_MAX_LEN (NAME_MAX - 4)


class Semafour : public node::ObjectWrap {
  public:
    static void Init(v8::Local<v8::Object> exports);
    int Post();
    int Wait();
    int Unlink();
    int Close();

  private:
    explicit Semafour(const char* name, uint32_t value, bool create, int* err);
    ~Semafour();
    sem_t* _sem;
    char _name[SEM_NAME_MAX_LEN];

    static v8::Persistent<v8::Function> constructor;
    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Post(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Wait(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Unlink(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Close(const v8::FunctionCallbackInfo<v8::Value>& args);
};


struct async_req {
  uv_work_t req;
  int result;
  Semafour* sem;
  v8::Isolate* isolate;
  v8::Persistent<v8::Function> callback;
};


#endif
