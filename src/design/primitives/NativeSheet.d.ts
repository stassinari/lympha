/**
 * A short note in a sheet from the bottom of the screen, drawn by the platform:
 * SwiftUI's `.sheet` on iOS, Material 3's `ModalBottomSheet` on Android. Each
 * brings its own drag handle, scrim, dismiss gestures and screen-reader modality,
 * which a sheet drawn in React Native would only imitate.
 *
 * Sized to its content on both. Implemented per platform in `NativeSheet.ios.tsx`
 * and `NativeSheet.android.tsx`; Metro picks the file, and this declares the one
 * shape both share. Takes text rather than React children because on iOS the
 * note is SwiftUI text — see that file for why.
 */
export type NativeSheetProps = {
  visible: boolean;
  /** Called once the user has dismissed the sheet. */
  onClose: () => void;
  title: string;
  body: string;
};

export declare function NativeSheet(props: NativeSheetProps): React.JSX.Element | null;
