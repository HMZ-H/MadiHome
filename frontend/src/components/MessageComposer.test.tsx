import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageComposer from './MessageComposer';

describe('MessageComposer', () => {
  it('renders textarea and send button', async () => {
    render(<MessageComposer onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type a message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('disables inputs when disabled prop is true', () => {
    render(<MessageComposer onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText('Type a message')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('calls onSend with trimmed text and clears input', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText('Type a message');

    await user.type(textarea, '  Hello doctor  ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith('Hello doctor');
    expect(textarea).toHaveValue('');
  });

  it('does not call onSend when text is empty', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageComposer onSend={onSend} />);
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('throttles onTyping to at most every 2 seconds', () => {
    const onSend = vi.fn();
    const onTyping = vi.fn();
    const nowSpy = vi.spyOn(Date, 'now');
    let fakeNow = 1000000;
    nowSpy.mockImplementation(() => fakeNow);

    render(<MessageComposer onSend={onSend} onTyping={onTyping} />);
    const textarea = screen.getByPlaceholderText('Type a message');

    fireEvent.change(textarea, { target: { value: 'a' } });
    expect(onTyping).toHaveBeenCalledTimes(1);

    fireEvent.change(textarea, { target: { value: 'ab' } });
    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(onTyping).toHaveBeenCalledTimes(1);

    fakeNow += 2100;
    fireEvent.change(textarea, { target: { value: 'abcd' } });
    expect(onTyping).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('sends on Enter key (without Shift)', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText('Type a message');

    await user.type(textarea, 'quick msg{Enter}');

    expect(onSend).toHaveBeenCalledWith('quick msg');
  });
});
