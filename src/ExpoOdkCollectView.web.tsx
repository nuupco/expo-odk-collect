import * as React from 'react';

import { ExpoOdkCollectViewProps } from './ExpoOdkCollect.types';

export default function ExpoOdkCollectView(props: ExpoOdkCollectViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
