package in.coderarmy.demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final ChatClient chatClient;

    private final List<Message> history = new ArrayList<>();

    public ChatService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    private static final String SYSTEM_PROMPT = """
            You are a customer-support executive for our
            premium streetwear and lifestyle e-commerce brand named BSNKing.
            
            Your job is to identify the customer's main
            problem and urgency. Answer them clearly and helpfully.
            
            Use professional, friendly language. If the customer has an issue,
            use words like I understand your frustration,
            I am really sorry for the inconvenience, and I will help resolve this.
            
            Do not answer any other question which is not
            related to product recommendations, product availability,
            size or fit questions, order tracking, shipping delays,
            returns and refunds, payment issues, account problems,
            or company policy queries.
            """;

    public String chat(String message) {

        // USER role
        history.add(new UserMessage(message));

        // SYSTEM + Conversation History
        String response = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .messages(history)
                .call()
                .content();

        // ASSISTANT role
        history.add(new AssistantMessage(response));

        return response;
    }

    public void clearHistory() {
        history.clear();
    }
}
