import { MessageProps } from '@patternfly/chatbot';
import { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { orderBy } from 'lodash';

export const openTicketOption = ['Yes', 'No'];

export const footnoteProps = {
    label: 'AI can make mistakes. Check important info.',
};

export const initialMessages: MessageProps[] = [];

export const welcomePrompts = [
    {
        title: 'Latest AI Advancements',
        message: 'Agentic AI',
        onClick: () => {
            console.log('welcomePrompts, Latest AI Advancements');
        },
    },
    {
        title: 'Latest research papers',
        message: 'deep learning architectures',
        onClick: () => {
            console.log('welcomePrompts, Latest research papers');
        },
    },
];

export function extractConversationsBySession(conversationHistory: any = []) {
    const sessionData: { user: string; ai: string; sources: [] }[] = [];
    let userMessage: string | null = null;

    conversationHistory?.forEach((entry: any) => {
        const messageType = entry.id[entry.id.length - 1];
        const content = entry?.kwargs?.content?.trim();
        const sources = entry?.kwargs?.additional_kwargs?.sources || [];

        if (messageType === 'HumanMessage' && content) {
            userMessage = content;
        } else if (messageType === 'AIMessage' && content && userMessage) {
            sessionData.push({ user: userMessage, ai: content, sources: sources });
            userMessage = null;
        }
    });
    return sessionData;
}

export const transformSessionsToConversations = (apiResponse: any): any => {
    const conversations: Record<string, Conversation[]> = {};

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const sortedSessions = orderBy(apiResponse.sessions, [(s) => new Date(s.createdAt)], ['desc']);

    sortedSessions.forEach((session: any) => {
        const createdAt = new Date(session.createdAt);
        const sessionDate = createdAt.toDateString();
        const sessionMonth = createdAt.getMonth();
        const sessionYear = createdAt.getFullYear();

        let groupKey: string;
        if (sessionDate === today.toDateString()) {
            groupKey = 'Today';
        } else if (sessionMonth === currentMonth && sessionYear === currentYear) {
            groupKey = 'This month';
        } else {
            groupKey = createdAt.toLocaleString('default', { month: 'long' });
        }

        if (!conversations[groupKey]) {
            conversations[groupKey] = [];
        }

        conversations[groupKey].push({
            id: session.sessionId,
            text: session.firstQuery || 'No query provided',
        });
    });

    return conversations;
};
