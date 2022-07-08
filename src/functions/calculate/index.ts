import type { APIGatewayProxyHandler } from 'aws-lambda'
import { isDefined } from 'src/common/utils'

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({
    region: 'eu-west-1',
})

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const { userId, firstNumber, secondNumber } = JSON.parse(event.body ?? '') as {
        userId: string
        firstNumber: string
        secondNumber: string
    }
    if (!isDefined(userId) || !isDefined(firstNumber) || !isDefined(secondNumber)) {
        return await Promise.resolve({
            body: "data hasn't been passed",
            statusCode: 401,
        })
    }

    const sendMessageCmd = new SendMessageCommand({
        MessageBody: JSON.stringify({ userId, firstNumber, secondNumber }),
        QueueUrl: process.env.QUEUE_URL,
    })
    try {
        await sqsClient.send(sendMessageCmd)
    } catch (error) {
        console.log('error while sending message to sqs')
        throw error
    }
    return await Promise.resolve({
        body: JSON.stringify({ calculation: 'some resulting number' }),
        statusCode: 200,
    })
}
