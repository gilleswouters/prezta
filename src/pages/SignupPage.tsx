import { useNavigate } from 'react-router-dom';
import { SignupModal } from '@/components/auth/SignupModal';

export default function SignupPage() {
    const navigate = useNavigate();
    return <SignupModal open={true} onClose={() => navigate('/')} />;
}
