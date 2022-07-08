import { makeProcessCalculation } from './process-calculation'

describe('test processing calculation logic', () => {
    it('should calculate result correctly', async () => {
        const s3Send = jest.fn()
        const dynamoSend = jest.fn()
        const s3Client = {
            send: s3Send,
        }
        const dynamoDbDocumentClient = {
            send: dynamoSend,
        }
        s3Send.mockResolvedValueOnce(true)
        dynamoSend.mockResolvedValueOnce(true)
        const processCalculation = makeProcessCalculation({
            s3Client: s3Client as any,
            dynamoDbDocumentClient: dynamoDbDocumentClient as any,
        })
        const result = await processCalculation({ firstNumber: 3, secondNumber: 5, userId: 'test' })
        expect(result).toEqual(8)
    })
})
