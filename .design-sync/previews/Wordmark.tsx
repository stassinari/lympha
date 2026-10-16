import { View, Wordmark, ScreenTitle, LymphaProvider, space } from 'lympha';

export const Header = () => <Wordmark tone="secondary">Lympha</Wordmark>;

export const AgainstScreenTitle = () => (
  <View style={{ gap: space.blocks }}>
    <Wordmark tone="secondary">Lympha</Wordmark>
    <ScreenTitle>Settings</ScreenTitle>
  </View>
);

export const Primary = () => <Wordmark>Lympha</Wordmark>;

export const Dark = () => (
  <LymphaProvider scheme="dark" style={{ padding: space.blocks }}>
    <Wordmark tone="secondary">Lympha</Wordmark>
  </LymphaProvider>
);
