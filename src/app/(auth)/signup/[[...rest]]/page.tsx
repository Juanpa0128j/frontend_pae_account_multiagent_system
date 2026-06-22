import { SignUp } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
    return <SignUp routing="path" path="/signup" signInUrl="/login" />;
}
