import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NeonBorder } from '@/components/common/NeonBorder';

describe('NeonBorder Component', () => {
  it('should render children correctly', () => {
    render(<NeonBorder color="cyan">Test Content</NeonBorder>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply cyan color class', () => {
    const { container } = render(
      <NeonBorder color="cyan">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('neon-border-cyan');
  });

  it('should apply magenta color class', () => {
    const { container } = render(
      <NeonBorder color="magenta">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('neon-border-magenta');
  });

  it('should apply purple color class', () => {
    const { container } = render(
      <NeonBorder color="purple">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('neon-border-purple');
  });

  it('should apply green color class', () => {
    const { container } = render(
      <NeonBorder color="green">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('neon-border-green');
  });

  it('should apply hover effect when hoverEffect is true', () => {
    const { container } = render(
      <NeonBorder color="cyan" hoverEffect>Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('hover:glow-cyan');
  });

  it('should not apply hover effect when hoverEffect is false', () => {
    const { container } = render(
      <NeonBorder color="cyan" hoverEffect={false}>Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).not.toHaveClass('hover:glow-cyan');
  });

  it('should apply pulse effect when pulseEffect is true', () => {
    const { container } = render(
      <NeonBorder color="cyan" pulseEffect>Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('animate-pulse-slow');
  });

  it('should not apply pulse effect when pulseEffect is false', () => {
    const { container } = render(
      <NeonBorder color="cyan" pulseEffect={false}>Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).not.toHaveClass('animate-pulse-slow');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <NeonBorder color="cyan" className="custom-class">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('custom-class');
  });

  it('should have base classes applied', () => {
    const { container } = render(
      <NeonBorder color="cyan">Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('rounded-lg', 'border', 'border-gray-800', 'transition-all', 'duration-300');
  });

  it('should render nested components correctly', () => {
    render(
      <NeonBorder color="cyan">
        <div>
          <p>Nested content</p>
        </div>
      </NeonBorder>
    );
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('should apply both hover and pulse effects together', () => {
    const { container } = render(
      <NeonBorder color="magenta" hoverEffect pulseEffect>Test</NeonBorder>
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('hover:glow-magenta', 'animate-pulse-slow');
  });
});
