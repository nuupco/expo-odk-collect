import { useEffect, useState } from 'react';
import { odk } from './ExpoOdkCollect.sdk';
import { OdkActivityResult, OdkErrorPayload } from './ExpoOdkCollect.types';

export const useOdk = () => {
  const [result, setResult] = useState<OdkActivityResult | null>(null);
  const [error, setError] = useState<OdkErrorPayload | null>(null);

  useEffect(() => {
    const sub1 = odk.onResult(setResult);
    const sub2 = odk.onError(setError);

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return {
    odk,
    result,
    error,
  };
};