import * as THREE from "three";
import { gsap } from "gsap";
import { clamp } from "./motion";

export type CameraRig = {
  readonly camera: THREE.PerspectiveCamera;
  readonly resize: (width: number, height: number) => void;
  readonly reset: (reduced: boolean) => void;
  readonly focus: (point: THREE.Vector3, reduced: boolean) => void;
  readonly dispose: () => void;
};

export type CameraRigOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly onTap: (clientX: number, clientY: number) => void;
};

type View = {
  targetX: number;
  targetZ: number;
  distance: number;
};

const preventContextMenu = (event: Event): void => event.preventDefault();

export const createCameraRig = (options: CameraRigOptions): CameraRig => {
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 240);
  const view: View = { targetX: 0, targetZ: 0, distance: 38 };
  const target = new THREE.Vector3(0, 1, 0);
  const pointers = new Map<number, { x: number; y: number }>();
  let dragging = false;
  let moved = 0;
  let startX = 0;
  let startY = 0;
  let pinchStart = 0;
  let pinchDistance = 0;
  let userMovedCamera = false;

  const apply = (): void => {
    target.set(view.targetX, 1, view.targetZ);
    const horizontal = view.distance * 0.68;
    camera.position.set(view.targetX + horizontal, view.distance * 0.8, view.targetZ + horizontal);
    camera.lookAt(target);
  };

  const pan = (dx: number, dy: number): void => {
    const scale = view.distance / 520;
    userMovedCamera = true;
    view.targetX = clamp(view.targetX - dx * scale - dy * scale * 0.4, -14, 14);
    view.targetZ = clamp(view.targetZ - dy * scale + dx * scale * 0.4, -12, 12);
    apply();
  };

  const zoom = (factor: number): void => {
    userMovedCamera = true;
    view.distance = clamp(view.distance * factor, 18, 66);
    apply();
  };

  const onPointerDown = (event: PointerEvent): void => {
    options.canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startY = event.clientY;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0));
      pinchDistance = view.distance;
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    const previous = pointers.get(event.pointerId);

    if (previous === undefined) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0));

      if (pinchStart > 0) {
        view.distance = clamp(pinchDistance * (pinchStart / Math.max(1, distance)), 18, 66);
        apply();
      }

      return;
    }

    if (!dragging) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;

    moved += Math.abs(dx) + Math.abs(dy);
    pan(dx, dy);
  };

  const onPointerUp = (event: PointerEvent): void => {
    const wasTap =
      pointers.size === 1 &&
      moved < 8 &&
      Math.abs(event.clientX - startX) < 8 &&
      Math.abs(event.clientY - startY) < 8;

    pointers.delete(event.pointerId);

    if (pointers.size === 0) {
      dragging = false;

      if (wasTap) options.onTap(event.clientX, event.clientY);
    }

    if (pointers.size < 2) pinchStart = 0;
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    zoom(event.deltaY > 0 ? 1.08 : 0.92);
  };

  options.canvas.addEventListener("pointerdown", onPointerDown);
  options.canvas.addEventListener("pointermove", onPointerMove);
  options.canvas.addEventListener("pointerup", onPointerUp);
  options.canvas.addEventListener("pointercancel", onPointerUp);
  options.canvas.addEventListener("wheel", onWheel, { passive: false });
  options.canvas.addEventListener("contextmenu", preventContextMenu);
  apply();

  return {
    camera,
    resize: (width: number, height: number) => {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();

      if (!userMovedCamera) {
        view.distance = camera.aspect < 0.85 ? 52 : 38;
        apply();
      }
    },
    reset: (reduced: boolean) => {
      gsap.to(view, {
        targetX: 0,
        targetZ: 0,
        distance: camera.aspect < 0.85 ? 52 : 38,
        duration: reduced ? 0 : 0.9,
        ease: "power2.inOut",
        onUpdate: apply,
      });
    },
    focus: (point: THREE.Vector3, reduced: boolean) => {
      gsap.to(view, {
        targetX: clamp(point.x, -13, 13),
        targetZ: clamp(point.z, -11, 11),
        distance: camera.aspect < 0.85 ? 34 : 24,
        duration: reduced ? 0 : 0.9,
        ease: "power2.inOut",
        onUpdate: apply,
      });
    },
    dispose: () => {
      gsap.killTweensOf(view);
      options.canvas.removeEventListener("pointerdown", onPointerDown);
      options.canvas.removeEventListener("pointermove", onPointerMove);
      options.canvas.removeEventListener("pointerup", onPointerUp);
      options.canvas.removeEventListener("pointercancel", onPointerUp);
      options.canvas.removeEventListener("wheel", onWheel);
      options.canvas.removeEventListener("contextmenu", preventContextMenu);
    },
  };
};
