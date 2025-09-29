import { useState, useCallback } from 'react';

export interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error' | 'info';
}

export interface ConfirmDialogState extends ConfirmDialogConfig {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirmDialog = useCallback((
    config: ConfirmDialogConfig
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...config,
        open: true,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, open: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const hideConfirmDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    dialogState,
    showConfirmDialog,
    hideConfirmDialog
  };
};