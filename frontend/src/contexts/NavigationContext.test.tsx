import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NavigationProvider, useNavigationActions } from './NavigationContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}

describe('useNavigationActions', () => {
  it('navigateTo switches activeView correctly', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    expect(result.current.activeView).toBe('notes');

    act(() => result.current.navigateTo('qa'));
    expect(result.current.activeView).toBe('qa');

    act(() => result.current.navigateTo('output'));
    expect(result.current.activeView).toBe('output');

    act(() => result.current.navigateTo('settings'));
    expect(result.current.activeView).toBe('settings');

    act(() => result.current.navigateTo('notes'));
    expect(result.current.activeView).toBe('notes');
  });

  it('selectNote sets selectedNoteId, activeView, and clears selectedPageId', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectNote(42));

    expect(result.current.activeView).toBe('notes');
    expect(result.current.selectedNoteId).toBe(42);
    expect(result.current.selectedPageId).toBeNull();
  });

  it('selectPage sets selectedPageId without changing selectedNoteId', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectNote(10));
    act(() => result.current.selectPage(5));

    expect(result.current.selectedNoteId).toBe(10);
    expect(result.current.selectedPageId).toBe(5);
    expect(result.current.activeView).toBe('notes');
  });

  it('selectNote clears previously selected page', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectNote(10));
    act(() => result.current.selectPage(5));
    expect(result.current.selectedPageId).toBe(5);

    act(() => result.current.selectNote(20));
    expect(result.current.selectedNoteId).toBe(20);
    expect(result.current.selectedPageId).toBeNull();
  });

  it('selectFolder sets selectedFolderId, activeView, and clears selectedFileId', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectFolder(7));

    expect(result.current.activeView).toBe('kb');
    expect(result.current.selectedFolderId).toBe(7);
    expect(result.current.selectedFileId).toBeNull();
  });

  it('selectFile sets selectedFileId without changing selectedFolderId', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectFolder(3));
    act(() => result.current.selectFile(99));

    expect(result.current.selectedFolderId).toBe(3);
    expect(result.current.selectedFileId).toBe(99);
  });

  it('selectFolder clears previously selected file', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectFolder(1));
    act(() => result.current.selectFile(100));
    expect(result.current.selectedFileId).toBe(100);

    act(() => result.current.selectFolder(2));
    expect(result.current.selectedFolderId).toBe(2);
    expect(result.current.selectedFileId).toBeNull();
  });

  it('navigateTo preserves selectedIds across view switches', () => {
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    act(() => result.current.selectNote(1));
    act(() => result.current.selectPage(2));
    act(() => result.current.navigateTo('qa'));

    expect(result.current.activeView).toBe('qa');
    expect(result.current.selectedNoteId).toBe(1);
    expect(result.current.selectedPageId).toBe(2);
  });
});
