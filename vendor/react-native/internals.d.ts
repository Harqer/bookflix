/**
 * 👑 Sovereign Library Declarations
 * Purpose: Providing Type Visibility for React Native Internals.
 */

declare module 'react-native/Libraries/Components/View/ViewPropTypes' {
  import { ViewProps } from 'react-native';
  export type { ViewProps };
}

declare module 'react-native/Libraries/Types/CodegenTypes' {
  export type DirectEventHandler<T> = (event: { nativeEvent: T }) => void;
  export type Double = number;
  export type Int32 = number;
}

declare module 'react-native/Libraries/Renderer/shims/ReactNativeTypes' {
  import { HostComponent } from 'react-native';
  export type { HostComponent };
}

declare module 'react-native/Libraries/Utilities/codegenNativeComponent' {
  export default function codegenNativeComponent<T>(name: string, options?: any): any;
}
