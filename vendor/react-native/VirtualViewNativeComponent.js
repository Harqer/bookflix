// @ts-nocheck
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {
  DirectEventHandler,
  Double,
  Int32,
} from 'react-native/Libraries/Types/CodegenTypes';
import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type NativeModeChangeEvent = Readonly<{
  mode: Int32,
  targetRect: Readonly<{
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  }>,
  thresholdRect: Readonly<{
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  }>,
}>;

type VirtualViewNativeProps = Readonly<{
  ...ViewProps,
  initialHidden?: boolean,
  removeClippedSubviews?: boolean,
  renderState: Int32,
  onModeChange?: DirectEventHandler<NativeModeChangeEvent>,
}>;

export default (codegenNativeComponent<VirtualViewNativeProps>('VirtualView', {
  interfaceOnly: true,
}) as HostComponent<VirtualViewNativeProps>);
*/

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
export default codegenNativeComponent('VirtualView', { interfaceOnly: true });
