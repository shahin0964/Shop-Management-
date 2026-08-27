/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlatformMode = 'WEB' | 'ANDROID_APK' | 'WINDOWS_EXE';

export type AndroidTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'transfers'
  | 'telecom_mfs'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'apk_info';

export type WindowsTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'transfers'
  | 'telecom_mfs'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'exe_info';
