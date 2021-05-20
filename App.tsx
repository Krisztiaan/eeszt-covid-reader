import 'react-native-reanimated';
import * as Sentry from 'sentry-expo';

import AppRoot from './src/AppRoot';

Sentry.init({
  dsn: 'https://c53b766227be407281d97d5a8098cc32@o691735.ingest.sentry.io/5774622',
  enableInExpoDevelopment: false,
  debug: false,
  integrations: [new Sentry.Native.ReactNativeTracing()],
});

export default AppRoot;
