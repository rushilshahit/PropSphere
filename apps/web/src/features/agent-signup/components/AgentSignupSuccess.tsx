import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export function AgentSignupSuccess() {
  return (
    <div className="text-center space-y-5 py-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />

      <div>
        <h2 className="text-xl font-bold text-neutral-900">Application Received!</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
          We'll review your details and get back to you within 2 business days.
          You'll receive an email at the address linked to your account once approved.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-btn px-4 py-3 text-sm text-amber-800">
        Your account has been marked as <strong>pending approval</strong>.
        Some agent features will become available once our team verifies your licence.
      </div>

      <Link to="/">
        <Button variant="secondary">Back to Home</Button>
      </Link>
    </div>
  );
}
