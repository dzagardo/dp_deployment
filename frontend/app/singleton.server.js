"use strict";
// Since the dev server re-requires the bundle, do some shenanigans to make
// certain things persist across that 😆
// Borrowed/modified from https://github.com/jenseng/abuse-the-platform/blob/2993a7e846c95ace693ce61626fa072174c8d9c7/app/utils/singleton.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleton = void 0;
var singleton = function (name, valueFactory) {
    var _a, _b;
    var _c;
    var g = global;
    (_a = g.__singletons) !== null && _a !== void 0 ? _a : (g.__singletons = {});
    (_b = (_c = g.__singletons)[name]) !== null && _b !== void 0 ? _b : (_c[name] = valueFactory());
    return g.__singletons[name];
};
exports.singleton = singleton;
