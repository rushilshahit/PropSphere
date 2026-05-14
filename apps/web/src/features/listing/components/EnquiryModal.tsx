import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateEnquiry } from '@/api/enquiries';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const schema = z.object({
  sender_name: z.string().min(1, 'Name is required'),
  sender_email: z.string().email('Enter a valid email address'),
  sender_phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

interface EnquiryModalProps {
  propertyId: string;
  agentId: string;
  agentName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EnquiryModal({ propertyId, agentId, agentName, isOpen, onClose }: EnquiryModalProps) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { mutate, isPending, error } = useCreateEnquiry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: "I'd like more information about this property." },
  });

  // Pre-fill name and email from logged-in user each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    reset({
      sender_name: user?.full_name ?? '',
      sender_email: user?.email ?? session?.user?.email ?? '',
      message: "I'd like more information about this property.",
    });
  }, [isOpen, user, session, reset]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onSubmit = (data: FormValues) => {
    mutate(
      { ...data, property_id: propertyId, agent_id: agentId },
      {
        onSuccess: () => {
          toast(agentName ? `Email sent to ${agentName}` : 'Enquiry sent!', 'success');
          reset();
          onClose();
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-card shadow-modal w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              {agentName ? `Email ${agentName}` : 'Send enquiry'}
            </h2>
            {agentName && (
              <p className="text-xs text-neutral-500 mt-0.5">Your message will be emailed directly to the agent</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Input
            label="Your name"
            {...register('sender_name')}
            error={errors.sender_name?.message}
            autoComplete="name"
          />
          <Input
            label="Email address"
            type="email"
            {...register('sender_email')}
            error={errors.sender_email?.message}
            autoComplete="email"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            {...register('sender_phone')}
            error={errors.sender_phone?.message}
            autoComplete="tel"
          />

          <div className="w-full">
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Message
            </label>
            <textarea
              {...register('message')}
              rows={4}
              className={`w-full border rounded-btn px-3 py-2.5 text-sm transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${errors.message ? 'border-red-400' : 'border-neutral-300'}`}
            />
            {errors.message && (
              <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500">
              {error instanceof Error ? error.message : 'Failed to send enquiry. Please try again.'}
            </p>
          )}

          <Button type="submit" loading={isPending} className="w-full" size="lg">
            Send enquiry
          </Button>
        </form>
      </div>
    </div>
  );
}
