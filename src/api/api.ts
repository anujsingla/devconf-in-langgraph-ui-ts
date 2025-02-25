import axios, { AxiosResponse } from 'axios';

export interface IAIResponse {
    sessionId: string | null;
    content: string;
    error: string;
}

export interface IAIPayload {
    message: string;
    sessionId?: string;
}

export const fetchAIData = async (bodyPayload: IAIPayload) => {
    const url = 'http://localhost:5000/chat';
    const response: AxiosResponse<IAIResponse> = await axios.post(url, JSON.stringify(bodyPayload), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

export interface IHistorySession {
    sessionId: string;
    createdAt: string;
    firstQuery: string;
}

export interface IHistoryResponse {
    sessionCount: number;
    sessions: IHistorySession[];
}

export const fetchSessions = async () => {
    const url = 'http://localhost:5000/sessions';
    const response: AxiosResponse<IHistoryResponse> = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

export interface IConversationSession {
    sessionId: string;
    conversation: {
        conversationHistory: any;
    };
}

export const fetchConversationBySessionId = async (sessionId: string) => {
    if (!sessionId) {
        return null;
    }
    const url = `http://localhost:5000/sessionById/${sessionId}`;
    const response: AxiosResponse<IConversationSession> = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};
