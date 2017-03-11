#ifndef _SEMAFOUR_H_
#define _SEMAFOUR_H_

#include <stdlib.h>
#include <unistd.h>
#include <node.h>
#include <node_object_wrap.h>
#include <uv.h>


class Semafour : public node::ObjectWrap {
  public:
    static void Init(v8::Local<v8::Object> exports);
    void Post();
    void Wait();

  private:
    explicit Semafour(uint32_t value = 0);
    ~Semafour();
    uv_sem_t _sem;

    static v8::Persistent<v8::Function> constructor;
    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Post(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Wait(const v8::FunctionCallbackInfo<v8::Value>& args);
};


struct async_req {
  uv_work_t req;
  Semafour* sem;
  v8::Isolate* isolate;
  v8::Persistent<v8::Function> callback;
};


#endif
