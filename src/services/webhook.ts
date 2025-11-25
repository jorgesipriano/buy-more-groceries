
export interface WebhookOrderData {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_complement?: string;
    payment_method: string;
    total_price: number;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
}

export const sendOrderNotification = async (orderData: WebhookOrderData) => {
    const WEBHOOK_URL = "https://00889fb9d85e.ngrok-free.app/webhook-novo-pedido";
    const WEBHOOK_SECRET = "Jj@@9590";

    try {
        console.log("Enviando notificação para o webhook...", orderData);

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${WEBHOOK_SECRET}`
            },
            body: JSON.stringify({
                record: orderData
            })
        });

        if (!response.ok) {
            throw new Error(`Erro no webhook: ${response.status} ${response.statusText}`);
        }

        console.log("Webhook enviado com sucesso!");
        return { success: true };
    } catch (error: any) {
        console.error("Falha ao enviar webhook:", error);
        return { success: false, message: error.message || "Erro desconhecido" };
    }
};
