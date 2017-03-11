#include <node.h>
#include "semafour.h"

using v8::Local;
using v8::Object;


void InitAll(Local<Object> exports) {
  Semafour::Init(exports);
}


NODE_MODULE(addon, InitAll)
