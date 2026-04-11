// Mock del módulo nativo
jest.mock('../src/ExpoOdkCollectModule', () => ({
  __esModule: true,
  default: {
    returnResult: jest.fn(),
    getIntentExtra: jest.fn(() => 'test-value'),
    getIntentExtras: jest.fn(() => ({ uuid: 'test-uuid', field1: 'value1' })),
    getForms: jest.fn(() => []),
    startODKCollect: jest.fn(),
    openOdkForms: jest.fn(),
    getCurrentODKid: jest.fn(() => 'uuid:test-uuid-123'),
    startInstanceUploaderList: jest.fn(),
    checkIfopenByODKform: jest.fn(() => 'android-app://org.odk.collect.android'),
    editODKInstance: jest.fn(),
    sendODKInstance: jest.fn(),
  },
}));

import {
  returnResult,
  getIntentExtra,
  getIntentExtras,
  getCurrentODKid,
  checkIfopenByODKform,
  sendODKInstance,
  ODK_REFERRER,
} from '../src/index';
import OdkCollectModule from '../src/ExpoOdkCollectModule';

// Cast to jest mocks for type-safe assertions
const mockModule = OdkCollectModule as unknown as {
  returnResult: jest.Mock;
  getIntentExtra: jest.Mock;
  getIntentExtras: jest.Mock;
  getForms: jest.Mock;
  startODKCollect: jest.Mock;
  openOdkForms: jest.Mock;
  getCurrentODKid: jest.Mock;
  startInstanceUploaderList: jest.Mock;
  checkIfopenByODKform: jest.Mock;
  editODKInstance: jest.Mock;
  sendODKInstance: jest.Mock;
};

describe('returnResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls native returnResult without callback', async () => {
    const data = { key: 'value' };
    await returnResult(data);
    expect(mockModule.returnResult).toHaveBeenCalledWith(data);
  });

  it('calls onBeforeReturn callback before native call', async () => {
    const data = { key: 'value' };
    const onBeforeReturn = jest.fn().mockResolvedValue(undefined);
    await returnResult(data, { onBeforeReturn });
    expect(onBeforeReturn).toHaveBeenCalledWith(data);
    expect(mockModule.returnResult).toHaveBeenCalledWith(data);
    // callback was called BEFORE native
    const callbackOrder = onBeforeReturn.mock.invocationCallOrder[0];
    const nativeOrder = mockModule.returnResult.mock.invocationCallOrder[0];
    expect(callbackOrder).toBeLessThan(nativeOrder);
  });

  it('propagates callback rejection without calling native', async () => {
    const data = { key: 'value' };
    const error = new Error('callback failed');
    const onBeforeReturn = jest.fn().mockRejectedValue(error);
    await expect(returnResult(data, { onBeforeReturn })).rejects.toThrow('callback failed');
    expect(mockModule.returnResult).not.toHaveBeenCalled();
  });
});

describe('getIntentExtra', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the value for an existing key', () => {
    mockModule.getIntentExtra.mockReturnValue('parcela-123');
    expect(getIntentExtra('id_parcela')).toBe('parcela-123');
    expect(mockModule.getIntentExtra).toHaveBeenCalledWith('id_parcela');
  });

  it('returns empty string when key is not present', () => {
    mockModule.getIntentExtra.mockReturnValue('');
    expect(getIntentExtra('nonexistent')).toBe('');
  });
});

describe('getIntentExtras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all extras from the intent', () => {
    const extras = { uuid: 'abc-123', nombre: 'Finca Sur', superficie: '10.5' };
    mockModule.getIntentExtras.mockReturnValue(extras);
    expect(getIntentExtras()).toEqual(extras);
    expect(mockModule.getIntentExtras).toHaveBeenCalled();
  });

  it('returns empty object when there are no extras', () => {
    mockModule.getIntentExtras.mockReturnValue({});
    expect(getIntentExtras()).toEqual({});
  });
});

describe('getCurrentODKid', () => {
  it('delegates to getIntentExtra("uuid")', () => {
    mockModule.getCurrentODKid.mockReturnValue('abc-123');
    expect(getCurrentODKid()).toBe('abc-123');
    expect(mockModule.getCurrentODKid).toHaveBeenCalled();
  });

  it('returns empty string when uuid is not present', () => {
    mockModule.getCurrentODKid.mockReturnValue('');
    expect(getCurrentODKid()).toBe('');
  });
});

describe('checkIfopenByODKform', () => {
  it('returns true when referrer matches ODK_REFERRER', () => {
    mockModule.checkIfopenByODKform.mockReturnValue(ODK_REFERRER);
    expect(checkIfopenByODKform()).toBe(true);
  });

  it('returns false when referrer does not match', () => {
    mockModule.checkIfopenByODKform.mockReturnValue('android-app://other.app');
    expect(checkIfopenByODKform()).toBe(false);
  });
});

describe('sendODKInstance', () => {
  it('passes instanceId and serverUrl to native module', () => {
    sendODKInstance('123', 'https://my.server.org');
    expect(mockModule.sendODKInstance).toHaveBeenCalledWith('123', 'https://my.server.org');
  });
});
