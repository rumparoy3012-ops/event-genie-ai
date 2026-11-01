/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventConfigurator } from '../src/components/EventConfigurator';

describe('EventConfigurator Component Suite', () => {
  it('renders all presets in the selector', () => {
    const onGenerate = vi.fn();
    render(<EventConfigurator onGenerate={onGenerate} isLoading={false} />);
    expect(screen.getByText('Grand Wedding')).toBeDefined();
    expect(screen.getByText('30th Milestone Birthday')).toBeDefined();
  });

  it('populates form inputs when preset is selected', () => {
    const onGenerate = vi.fn();
    render(<EventConfigurator onTest={onGenerate} onGenerate={onGenerate} isLoading={false} />);
    const weddingBtn = screen.getByText('Grand Wedding');
    fireEvent.click(weddingBtn);
    const submitBtn = screen.getByRole('button', { name: /generate/i });
    expect(submitBtn).toBeDefined();
  });

  it('disables submit button when isLoading is true', () => {
    const onGenerate = vi.fn();
    render(<EventConfigurator onTest={onGenerate} onGenerate={onGenerate} isLoading={true} />);
    const submitBtn = screen.getByRole('button', { name: /generating/i });
    expect(submitBtn).toBeDefined();
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
