import { create } from 'zustand';
import { accountApi } from '@/services';
import i18n from '@/i18n';

interface VerificationState {
  isOpen: boolean;
  title: string;
  description: string;
  isLoading: boolean;
  error: string | null;
}

interface VerificationActions {
  /** Open modal, returns a fresh verificationRecordId on success. Rejects on cancel. */
  verify: (opts?: { title?: string; description?: string }) => Promise<string>;
  /** Called by the modal form to submit password */
  submitPassword: (password: string) => Promise<void>;
  /** Cancel and close modal */
  cancel: () => void;
}

// Promise handlers stored outside React to survive re-renders
let _resolve: ((value: string) => void) | null = null;
let _reject: ((reason: Error) => void) | null = null;

export const useVerificationStore = create<VerificationState & VerificationActions>((set) => ({
  isOpen: false,
  title: '',
  description: '',
  isLoading: false,
  error: null,

  verify: (opts) => {
    return new Promise<string>((resolve, reject) => {
      // Replace any pending request
      _reject?.(new Error('cancelled'));
      _resolve = resolve;
      _reject = reject;
      set({
        isOpen: true,
        title: opts?.title ?? i18n.t('security.verification.title'),
        description: opts?.description ?? i18n.t('security.verification.description'),
        error: null,
        isLoading: false,
      });
    });
  },

  submitPassword: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await accountApi.verifyPassword(password);
      set({ isOpen: false, isLoading: false, error: null });
      _resolve?.(response.verificationRecordId);
      _resolve = null;
      _reject = null;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : i18n.t('security.verification.verifyFailed'),
        isLoading: false,
      });
      // Don't reject — let user retry in the modal
    }
  },

  cancel: () => {
    set({ isOpen: false, error: null, isLoading: false });
    _reject?.(new Error('cancelled'));
    _resolve = null;
    _reject = null;
  },
}));
