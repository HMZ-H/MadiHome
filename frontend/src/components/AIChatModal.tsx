import Modal from './Modal';
import AIChat from './AIChat';

interface AIChatModalProps {
	isOpen: boolean;
	onClose: () => void;
	roomId: number;
}

export default function AIChatModal({ isOpen, onClose, roomId }: AIChatModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="p-4">
				<AIChat roomId={roomId} />
			</div>
		</Modal>
	);
}










