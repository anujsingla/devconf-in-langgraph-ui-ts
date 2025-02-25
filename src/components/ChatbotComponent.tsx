import React, { Fragment, useEffect, useRef, useState } from 'react';

import { DropdownList, DropdownItem } from '@patternfly/react-core';

import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import Message, { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import ChatbotConversationHistoryNav, {
    Conversation,
} from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotHeader, {
    ChatbotHeaderMenu,
    ChatbotHeaderMain,
    ChatbotHeaderActions,
    ChatbotHeaderSelectorDropdown,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';

import {
    extractConversationsBySession,
    footnoteProps,
    transformSessionsToConversations,
    welcomePrompts,
} from '../mockdata';
import { fetchAIData, fetchConversationBySessionId, fetchSessions, IAIResponse } from '../api/api';
import { forEach, isEmpty } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import { getBotLoadingMessage, getBotMessage, getUserMessage } from '../appUtils';

export const ChatbotComponent = () => {
    const { sessionId } = useParams<{ sessionId?: string }>();

    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [selectedModel, setSelectedModel] = useState('Llama 3.2');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[] | { [key: string]: Conversation[] }>({});
    const scrollToBottomRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();

    console.log('messages outside', messages);

    const displayMode = ChatbotDisplayMode.fullscreen;
    // Autu-scrolls to the latest message
    useEffect(() => {
        // don't scroll the first load - in this demo, we know we start with two messages
        if (messages.length > 2) {
            scrollToBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const sessions = await fetchSessions();
                const conver = transformSessionsToConversations(sessions || []);
                setConversations(conver);
                onSelectHistoryItem(sessionId);
            } catch {
                console.log('error in loading sessions');
            }
        };
        fetchSessionData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const onSelectModel = (
        _event: React.MouseEvent<Element, MouseEvent> | undefined,
        value: string | number | undefined
    ) => {
        setSelectedModel(value as string);
    };

    const handleSend = async (message: string) => {
        console.log('handleSend');
        if (isEmpty(message)) {
            return;
        }
        console.log('handlesend', messages);
        const newMessages: MessageProps[] = [];
        messages.forEach((message) => newMessages.push(message));
        // It's important to set a timestamp prop since the Message components re-render.
        // The timestamps re-render with them.
        newMessages.push(getUserMessage(message));
        newMessages.push(getBotLoadingMessage());
        setMessages(newMessages);
        // make announcement to assistive devices that new messages have been added
        const loadedMessages: MessageProps[] = [];
        newMessages.forEach((message) => loadedMessages.push(message));
        loadedMessages.pop();
        let response: IAIResponse | null = null;
        try {
            response = await fetchAIData({
                message: message?.trim() || '',
                sessionId: sessionId || undefined,
            });
        } catch {
            console.log('backend error', response?.error);
        } finally {
            console.log('api response', response, response?.content);

            loadedMessages.push(getBotMessage(response?.content as string, true, null));

            if (response?.sessionId && isEmpty(sessionId)) {
                navigate(`/chat/${response?.sessionId}`);
            }
            setMessages(loadedMessages);
        }
    };

    const findMatchingItems = (targetValue: string) => {
        let filteredConversations = Object.entries(conversations).reduce((acc, [key, items]) => {
            const filteredItems = (items as any).filter((item: any) =>
                item.text.toLowerCase().includes(targetValue.toLowerCase())
            );
            if (filteredItems.length > 0) {
                acc[key] = filteredItems;
            }
            return acc;
        }, {} as any);

        // append message if no items are found
        if (Object.keys(filteredConversations).length === 0) {
            filteredConversations = [{ id: '13', noIcon: true, text: 'No results found' }];
        }
        return filteredConversations;
    };

    const headerModelSelection = (
        <ChatbotHeaderActions>
            <ChatbotHeaderSelectorDropdown value={selectedModel} onSelect={onSelectModel}>
                <DropdownList>
                    <DropdownItem value="Llama 3.2" key="llama">
                        Llama 3.2
                    </DropdownItem>
                    <DropdownItem value="Granite 7B" key="granite">
                        Granite 7B
                    </DropdownItem>
                </DropdownList>
            </ChatbotHeaderSelectorDropdown>
        </ChatbotHeaderActions>
    );

    const headerComponent = (
        <ChatbotHeader>
            <ChatbotHeaderMain>
                <ChatbotHeaderMenu
                    ref={historyRef}
                    aria-expanded={isDrawerOpen}
                    onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)}
                />
            </ChatbotHeaderMain>
            {headerModelSelection}
        </ChatbotHeader>
    );

    const onSelectHistoryItem = async (sessionId: string | undefined) => {
        if (isEmpty(sessionId)) {
            return;
        }
        console.log('onSelectHistoryItem', sessionId);
        const sessionDetail = await fetchConversationBySessionId(sessionId as string);
        console.log('sessionDetail', sessionDetail);
        const history = extractConversationsBySession(sessionDetail?.conversation?.conversationHistory || []);
        console.log('history', history);
        const tempHistory: MessageProps[] = [];
        forEach(history || [], (h) => {
            tempHistory.push(getUserMessage(h.user));
            tempHistory.push(getBotMessage(h.ai));
        });
        setMessages(tempHistory);
        navigate(`/chat/${sessionId}`);
    };

    return (
        <Chatbot displayMode={displayMode}>
            <ChatbotConversationHistoryNav
                displayMode={displayMode}
                onDrawerToggle={() => {
                    setIsDrawerOpen(!isDrawerOpen);
                }}
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
                activeItemId={sessionId}
                onSelectActiveItem={(_, selectedItem) => onSelectHistoryItem(selectedItem as any)}
                conversations={conversations}
                onNewChat={() => {
                    setIsDrawerOpen(!isDrawerOpen);
                    setMessages([]);
                    navigate('/chat');
                }}
                handleTextInputChange={(value: string) => {
                    if (value === '') {
                        // setConversations(initialConversations);
                    }
                    // this is where you would perform search on the items in the drawer
                    // and update the state
                    const newConversations: { [key: string]: Conversation[] } = findMatchingItems(value);
                    setConversations(newConversations);
                }}
                drawerContent={
                    <>
                        {headerComponent}
                        <ChatbotContent>
                            <MessageBox>
                                <ChatbotWelcomePrompt
                                    title="Hello, Anuj"
                                    description="How may I help you today?"
                                    prompts={welcomePrompts}
                                />
                                {messages.map((message, index) => {
                                    if (index === messages.length - 1) {
                                        return (
                                            <Fragment key={message.id}>
                                                <div ref={scrollToBottomRef}></div>
                                                <Message key={message.id} {...message} />
                                            </Fragment>
                                        );
                                    }
                                    return <Message key={message.id} {...message} />;
                                })}
                            </MessageBox>
                        </ChatbotContent>
                        <ChatbotFooter>
                            <MessageBar
                                alwayShowSendButton
                                hasAttachButton={false}
                                onSendMessage={handleSend}
                            />

                            <ChatbotFootnote {...footnoteProps} />
                        </ChatbotFooter>
                    </>
                }
            ></ChatbotConversationHistoryNav>
        </Chatbot>
    );
};

