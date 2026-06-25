import { registerPlugin } from "@capacitor/core";

interface BatteryOptimizationPlugin {
  isIgnoringBatteryOptimizations(): Promise<{ ignoring: boolean }>;
  requestIgnoreBatteryOptimizations(): Promise<{ ignoring: boolean }>;
}

const BatteryOptimization = registerPlugin<BatteryOptimizationPlugin>("BatteryOptimization");

/** バッテリー最適化の対象から既に除外されているか(=画面オフでも通知が遅延しにくい状態か) */
export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  const { ignoring } = await BatteryOptimization.isIgnoringBatteryOptimizations();
  return ignoring;
}

/** OSの「バッテリーの最適化を無視する」許可設定画面を開く */
export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  const { ignoring } = await BatteryOptimization.requestIgnoreBatteryOptimizations();
  return ignoring;
}
