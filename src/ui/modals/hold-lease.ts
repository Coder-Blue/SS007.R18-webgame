export type HoldLease = {
  readonly sync: (isOpen: boolean) => void;
  readonly release: () => void;
};

export const createHoldLease = (setHold: (value: boolean) => void): HoldLease => {
  let held = false;

  return {
    sync: (isOpen) => {
      if (isOpen) {
        setHold(true);
        held = true;
      } else if (held) {
        setHold(false);
        held = false;
      }
    },
    release: () => {
      if (!held) return;

      setHold(false);
      held = false;
    },
  };
};
