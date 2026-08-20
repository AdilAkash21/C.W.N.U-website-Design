import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import { cn } from '../../utils/cn';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(120),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: 'location',
    title: 'Visit Us',
    lines: ['Shunqing District, Section 4', 'Nanchong, Sichuan, China'],
  },
  {
    icon: 'phone',
    title: 'Call Us',
    lines: ['+86 123 456 7890', 'Mon - Fri, 10 AM to 5 PM'],
  },
  {
    icon: 'mail',
    title: 'Email Us',
    lines: ['cwnu1941@gmail.com', 'We reply within 24 hours'],
  },
];

export function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus('submitting');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      reset();
    } catch {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero with Map */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-academic-navy via-academic-navy-light to-academic-dark" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 text-primary-400 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Our Location
            </span>
            <h1 className="text-display-lg font-bold text-white mb-4">Find Us on the Map</h1>
            <p className="text-body-lg text-gray-300">China West Normal University — Nanchong, Sichuan, China</p>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-[50vh] w-full">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10534.100224827502!2d106.06374944010042!3d30.823657460247176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x36f29735ee1dcfd3%3A0x6152939c109ac2ec!2sChina%20West%20Normal%20University!5e1!3m2!1sen!2s!4v1756300254248!5m2!1sen!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="CWNU campus location on Google Maps"
            className="absolute inset-0"
          />
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section bg-gray-50 dark:bg-gray-950 -mt-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 p-8 h-full">
                <h2 className="text-heading-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">Get in Touch</h2>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-8">
                  Have a question or want to learn more? We'd love to hear from you. Reach out through any of the channels below.
                </p>

                <div className="space-y-6 mb-8">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        {getContactIcon(item.icon)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        {item.lines.map((line, i) => (
                          <p key={i} className="text-body text-gray-600 dark:text-gray-400">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">Follow Us</p>
                  <div className="flex gap-3">
                    {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                      <a
                        key={social}
                        href="#"
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-all duration-200"
                        aria-label={social}
                      >
                        {getSocialIcon(social)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="p-8">
                <h2 className="text-heading-lg font-semibold mb-2">Send a Message</h2>
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" role="alert">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Thanks! Your message has been sent successfully. We'll get back to you soon.</span>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">
                    Something went wrong. Please try again later.
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input
                      label="Your Name"
                      placeholder="John Doe"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                    <Input
                      label="Your Email"
                      type="email"
                      placeholder="john@example.com"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                  </div>
                  <Input
                    label="Subject"
                    placeholder="How can we help?"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                  <Textarea
                    label="Message"
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    error={errors.message?.message}
                    {...register('message')}
                  />
                  <Button type="submit" className="w-full" isLoading={submitStatus === 'submitting'}>
                    Send Message
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="section bg-white dark:bg-gray-900" aria-labelledby="offices-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="section-header">
            <h2 id="offices-title" className="section-title">University Offices</h2>
            <p className="section-subtitle">Direct contacts for specific inquiries</p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Admissions Office', email: 'admissions@cwnu.edu', phone: '+86 123 456 7891', hours: 'Mon-Fri: 9 AM - 5 PM' },
              { title: 'Registrar', email: 'registrar@cwnu.edu', phone: '+86 123 456 7892', hours: 'Mon-Fri: 8 AM - 4 PM' },
              { title: 'Student Services', email: 'studentservices@cwnu.edu', phone: '+86 123 456 7893', hours: 'Mon-Fri: 9 AM - 5 PM' },
              { title: 'Financial Aid', email: 'finaid@cwnu.edu', phone: '+86 123 456 7894', hours: 'Mon-Fri: 9 AM - 4 PM' },
              { title: 'International Office', email: 'international@cwnu.edu', phone: '+86 123 456 7895', hours: 'Mon-Fri: 9 AM - 5 PM' },
              { title: 'Career Services', email: 'career@cwnu.edu', phone: '+86 123 456 7896', hours: 'Mon-Fri: 9 AM - 5 PM' },
            ].map((office) => (
              <Card key={office.title} variant="hover" className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{office.title}</h3>
                <div className="space-y-2 text-body text-gray-600 dark:text-gray-400">
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {office.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {office.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {office.hours}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function getContactIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    location: (
      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    phone: (
      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    mail: (
      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[name] || icons.location;
}

function getSocialIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-1.689-.072-4.947-.072zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.354 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.947-.072 4.354-.2 6.78-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-1.689-.072-4.947-.072z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };
  return icons[name] || icons.facebook;
}