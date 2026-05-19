import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatPrice } from '@propsphere/utils';
import { useSubmitOffer } from '@/api/offers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

const offerSchema = z.object({
  amount:         z.coerce.number().min(1, 'Enter an offer amount'),
  message:        z.string().max(500).optional(),
  isConfidential: z.boolean(),
  senderName:     z.string().min(2, 'Name required'),
  senderEmail:    z.string().email('Valid email required'),
  senderPhone:    z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferModalProps {
  propertyId: string;
  agentId: string;
  askingPrice?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function OfferModal({ propertyId, agentId, askingPrice, isOpen, onClose }: OfferModalProps) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { mutate, isPending, error } = useSubmitOffer();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { isConfidential: false },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      senderName:     user?.full_name ?? '',
      senderEmail:    user?.email ?? session?.user?.email ?? '',
      isConfidential: false,
    });
  }, [isOpen, user, session, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onSubmit = (data: OfferFormValues) => {
    mutate(
      {
        propertyId,
        agentId,
        amount:         data.amount,
        message:        data.message,
        isConfidential: data.isConfidential,
        senderName:     data.senderName,
        senderEmail:    data.senderEmail,
        senderPhone:    data.senderPhone,
      },
      {
        onSuccess: () => {
          toast('Offer submitted!', 'success');
          reset();
          onClose();
        },
      },
    );
  };

  if (!isOpen) return null;

  const quickChips = askingPrice
    ? [
        { label: 'Asking', value: askingPrice },
        { label: '-5%',    value: Math.round((askingPrice * 0.95) / 50000) * 50000 },
        { label: '+5%',    value: Math.round((askingPrice * 1.05) / 50000) * 50000 },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-card shadow-modal w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Make an Offer</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Your offer is not legally binding until accepted in writing
            </p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Offer amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium select-none">
                ₹
              </span>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0"
                className={`w-full pl-8 pr-3 py-2.5 border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                  errors.amount ? 'border-red-400' : 'border-neutral-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
            )}
            {askingPrice && (
              <p className="text-xs text-neutral-500 mt-1">
                Asking price: {formatPrice(askingPrice)}
              </p>
            )}
            {quickChips.length > 0 && (
              <div className="flex gap-2 mt-2">
                {quickChips.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setValue('amount', q.value)}
                    className="text-xs border border-neutral-200 rounded-[4px] px-2.5 py-1 hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Message to agent (optional)
            </label>
            <textarea
              {...register('message')}
              rows={3}
              maxLength={500}
              placeholder="Any additional details about your offer…"
              className={`w-full border rounded-btn px-3 py-2.5 text-sm transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
                errors.message ? 'border-red-400' : 'border-neutral-300'
              }`}
            />
            {errors.message && (
              <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
            )}
          </div>

          <Input
            label="Your name"
            {...register('senderName')}
            error={errors.senderName?.message}
            autoComplete="name"
          />
          <Input
            label="Email address"
            type="email"
            {...register('senderEmail')}
            error={errors.senderEmail?.message}
            autoComplete="email"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            {...register('senderPhone')}
            error={errors.senderPhone?.message}
            autoComplete="tel"
          />

          {/* Confidential toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isConfidential')} className="sr-only peer" />
            <div className="w-9 h-5 bg-neutral-200 rounded-full relative after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:bg-brand-primary peer-checked:after:translate-x-4" />
            <span className="text-sm text-neutral-700">Keep my offer confidential</span>
          </label>

          {error && (
            <p className="text-xs text-red-500">
              {error instanceof Error ? error.message : 'Failed to submit offer. Please try again.'}
            </p>
          )}

          <Button type="submit" loading={isPending} className="w-full" size="lg">
            Submit offer
          </Button>
        </form>
      </div>
    </div>
  );
}
