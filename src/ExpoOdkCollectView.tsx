import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoOdkCollectViewProps } from './ExpoOdkCollect.types';

const NativeView: React.ComponentType<ExpoOdkCollectViewProps> =
  requireNativeView('ExpoOdkCollect');

export default function ExpoOdkCollectView(props: ExpoOdkCollectViewProps) {
  return <NativeView {...props} />;
}
