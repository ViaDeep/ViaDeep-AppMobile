// onnxruntime-react-native trae un unimodule.json antiguo. Por eso el autolinking de Expo lo toma
// como módulo de Expo sin clases y nunca registra OnnxruntimePackage, y la app queda en modo manual.
// Declararlo aquí hace que se enlace como módulo de React Native en Android.
module.exports = {
  dependencies: {
    'onnxruntime-react-native': {
      platforms: {
        android: {},
      },
    },
  },
};
