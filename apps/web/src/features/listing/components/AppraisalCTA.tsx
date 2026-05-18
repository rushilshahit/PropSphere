import { useForm } from 'react-hook-form';
import { useCreateEnquiry } from '@/api/enquiries';
import { Button, Input } from '@/components/ui';

interface AppraisalCTAProps {
  suburb: string;
  agentId: string;
  propertyId: string;
}

interface AppraisalForm {
  sender_name: string;
  sender_email: string;
  sender_phone: string;
}

export function AppraisalCTA({ suburb, agentId, propertyId }: AppraisalCTAProps) {
  const { register, handleSubmit } = useForm<AppraisalForm>();
  const { mutate, isPending, isSuccess } = useCreateEnquiry();

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-5 text-center">
        <p className="font-semibold text-green-700">Request sent!</p>
        <p className="text-sm text-neutral-500 mt-1">An agent will contact you within 24 hours.</p>
      </div>
    );
  }

  function handleAppraisalSubmit(data: AppraisalForm) {
    mutate({
      property_id: propertyId,
      agent_id: agentId,
      sender_name: data.sender_name,
      sender_email: data.sender_email,
      sender_phone: data.sender_phone,
      message: `I'm interested in a free property appraisal near ${suburb}.`,
    });
  }

  return (
    <section className="bg-neutral-50 border border-neutral-200 rounded-card p-6">
      <h3 className="text-lg font-bold text-neutral-900">Thinking of selling?</h3>
      <p className="text-sm text-neutral-500 mb-4">
        Get a free appraisal from a local expert in {suburb}.
      </p>
      <form onSubmit={handleSubmit(handleAppraisalSubmit)} className="space-y-3">
        <Input label="Your name" {...register('sender_name')} required />
        <Input label="Your email" type="email" {...register('sender_email')} required />
        <Input label="Your phone" type="tel" {...register('sender_phone')} />
        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          Request free appraisal
        </Button>
      </form>
    </section>
  );
}
