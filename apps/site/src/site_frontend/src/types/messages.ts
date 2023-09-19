import z from 'zod';

export const ZLoginSiteReadyMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_site_ready')
});
export type ILoginSiteReadyMsg = z.infer<typeof ZLoginSiteReadyMsg>;

export const ZLoginRequestMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_request')
});
export type ILoginRequestMsg = z.infer<typeof ZLoginRequestMsg>;

export const ZLoginResultMsg = z.object({
    domain: z.literal('internet-computer-metamask-snap'),
    type: z.literal('login_result'),
    result: z.boolean(),
});
export type ILoginResultMsg = z.infer<typeof ZLoginResultMsg>;