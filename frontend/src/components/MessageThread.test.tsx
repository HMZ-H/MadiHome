import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageThread from './MessageThread';
import type { Message } from '../hooks/useMessages';

const baseMsg: Message = {
  id: 1,
  sender_id: 1,
  receiver_id: 2,
  room_id: 0,
  content: '',
  timestamp: new Date().toISOString(),
  is_read: false,
};

describe('MessageThread', () => {
  it('renders messages', () => {
    const messages: Message[] = [
      { ...baseMsg, id: 1, content: 'Hello' },
      { ...baseMsg, id: 2, sender_id: 2, receiver_id: 1, content: 'Hi there' },
    ];

    render(<MessageThread messages={messages} currentUserId={1} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('shows loading indicator', () => {
    render(<MessageThread messages={[]} currentUserId={1} loading={true} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<MessageThread messages={[]} currentUserId={1} error="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('aligns own messages to the right', () => {
    const messages: Message[] = [
      { ...baseMsg, id: 1, sender_id: 5, content: 'my message' },
    ];

    const { container } = render(<MessageThread messages={messages} currentUserId={5} />);
    const wrapper = container.querySelector('.justify-end');
    expect(wrapper).not.toBeNull();
  });

  it('aligns other messages to the left', () => {
    const messages: Message[] = [
      { ...baseMsg, id: 1, sender_id: 99, content: 'their message' },
    ];

    const { container } = render(<MessageThread messages={messages} currentUserId={5} />);
    const wrapper = container.querySelector('.justify-start');
    expect(wrapper).not.toBeNull();
  });

  it('renders empty state without crashing', () => {
    const { container } = render(<MessageThread messages={[]} currentUserId={1} />);
    expect(container).toBeTruthy();
  });
});
