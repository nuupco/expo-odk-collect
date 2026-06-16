const mockAddListener = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: mockAddListener,
  })),
}));

jest.mock('../src/ExpoOdkCollectModule', () => ({
  __esModule: true,
  default: {
    isInstalled: jest.fn(() => true),
    launchCollect: jest.fn(),
    isOpenedByOdk: jest.fn(() => false),
    getForms: jest.fn(() => []),
    getInstances: jest.fn(() => []),
    openFormsList: jest.fn(),
    openInstancesList: jest.fn(),
    pickForm: jest.fn(),
    pickInstance: jest.fn(),
    editInstance: jest.fn(),
    fillForm: jest.fn(),
    returnResult: jest.fn(),
    getIntentExtras: jest.fn(() => ({ uuid: 'test-uuid' })),
  },
}));

import { odk } from '../src/index';
import OdkNative from '../src/ExpoOdkCollectModule';

const mockNative = OdkNative as unknown as {
  isInstalled: jest.Mock;
  launchCollect: jest.Mock;
  isOpenedByOdk: jest.Mock;
  getForms: jest.Mock;
  getInstances: jest.Mock;
  openFormsList: jest.Mock;
  openInstancesList: jest.Mock;
  pickForm: jest.Mock;
  pickInstance: jest.Mock;
  editInstance: jest.Mock;
  fillForm: jest.Mock;
  returnResult: jest.Mock;
  getIntentExtras: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAddListener.mockReturnValue({ remove: mockRemove });
});

describe('odk client', () => {
  it('isInstalled resolves native value', async () => {
    mockNative.isInstalled.mockReturnValue(true);
    await expect(odk.isInstalled()).resolves.toBe(true);
    expect(mockNative.isInstalled).toHaveBeenCalled();
  });

  it('launch delegates to launchCollect', () => {
    odk.launch();
    expect(mockNative.launchCollect).toHaveBeenCalled();
  });

  it('isOpenedByOdk resolves native value', async () => {
    mockNative.isOpenedByOdk.mockReturnValue(true);
    await expect(odk.isOpenedByOdk()).resolves.toBe(true);
    expect(mockNative.isOpenedByOdk).toHaveBeenCalled();
  });

  it('getForms normalizes payload', async () => {
    mockNative.getForms.mockReturnValue([
      { _id: 'f1', displayName: 'Form 1', jrFormId: 'form_1', jrVersion: 'v1' },
      { _id: 'f2', jrFormId: 'form_2' },
    ]);

    await expect(odk.getForms()).resolves.toEqual([
      { id: 'f1', displayName: 'Form 1', jrFormId: 'form_1', jrVersion: 'v1' },
      { id: 'f2', displayName: 'Sin nombre', jrFormId: 'form_2', jrVersion: undefined },
    ]);
  });

  it('getInstances normalizes payload', async () => {
    mockNative.getInstances.mockReturnValue([
      {
        _id: 'i1',
        displayName: 'Instancia 1',
        jrFormId: 'form_1',
        status: 'complete',
        date: '2026-01-01',
        deletedDate: '2026-01-02',
      },
    ]);

    await expect(odk.getInstances()).resolves.toEqual([
      {
        id: 'i1',
        instanceId: 'i1',
        displayName: 'Instancia 1',
        jrFormId: 'form_1',
        jrVersion: undefined,
        status: 'complete',
        createdAt: '2026-01-01',
        deletedAt: '2026-01-02',
      },
    ]);
  });

  it('openForms delegates to openFormsList', () => {
    odk.openForms();
    expect(mockNative.openFormsList).toHaveBeenCalled();
  });

  it('openInstances delegates to openInstancesList', () => {
    odk.openInstances();
    expect(mockNative.openInstancesList).toHaveBeenCalled();
  });

  it('pickForm delegates to native', () => {
    odk.pickForm();
    expect(mockNative.pickForm).toHaveBeenCalled();
  });

  it('pickInstance delegates to native', () => {
    odk.pickInstance();
    expect(mockNative.pickInstance).toHaveBeenCalled();
  });

  it('editInstance passes id to native', () => {
    odk.editInstance('inst-123');
    expect(mockNative.editInstance).toHaveBeenCalledWith('inst-123');
  });

  it('fillForm passes id to native', () => {
    odk.fillForm('form-123');
    expect(mockNative.fillForm).toHaveBeenCalledWith('form-123');
  });

  it('returnResult delegates payload to native', () => {
    const payload = { key: 'value' };
    odk.returnResult(payload);
    expect(mockNative.returnResult).toHaveBeenCalledWith(payload);
  });

  it('getIntentExtras resolves native extras', async () => {
    const extras = { uuid: 'abc-123', nombre: 'Finca Sur' };
    mockNative.getIntentExtras.mockReturnValue(extras);
    await expect(odk.getIntentExtras()).resolves.toEqual(extras);
  });

  it('onResult subscribes to onActivityResult and returns removable subscription', () => {
    const callback = jest.fn();
    const sub = odk.onResult(callback);

    expect(mockAddListener).toHaveBeenCalledWith('onActivityResult', callback);
    sub.remove();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('onError subscribes to onError and returns removable subscription', () => {
    const callback = jest.fn();
    const sub = odk.onError(callback);

    expect(mockAddListener).toHaveBeenCalledWith('onError', callback);
    sub.remove();
    expect(mockRemove).toHaveBeenCalled();
  });
});
