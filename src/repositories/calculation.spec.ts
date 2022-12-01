import { makeCalculationRepository } from './calculation'
import { DynamoDBClient, DynamoDBClientResolvedConfig } from '@aws-sdk/client-dynamodb'
import { BatchManager, Connection, EntityManager } from '@typedorm/core'

describe('calculation repository', () => {
    const mockSend = jest.fn()

    const dynamoDbClient: Partial<DynamoDBClient> = {
        send: mockSend,
        config: {} as any as DynamoDBClientResolvedConfig,
    }
    const mockFindOne = jest.fn()
    const mockWrite = jest.fn()
    const { getCalculation, addCalculation } = makeCalculationRepository({
        dynamoDbClient: dynamoDbClient as DynamoDBClient,
        connection: {
            entityManager: {
                findOne: mockFindOne,
            } as any as EntityManager,
            batchManager: {
                write: mockWrite,
            } as any as BatchManager,
        } as any as Connection,
    })
    describe('getCalculation', () => {
        it('should return a calculation', async () => {
            const partitionKey = 'partitionKey'
            const sortKey = 'sortKey'
            const storedAt = 'storedAt'
            const createdAt = 'createdAt'
            const calculation = {
                partitionKey,
                sortKey,
                storedAt,
                createdAt,
            }
            mockFindOne.mockResolvedValueOnce(calculation)
            const result = await getCalculation(partitionKey, sortKey)
            expect(result).toEqual(calculation)
            expect(mockFindOne).toBeCalledTimes(1)
        })
    })
    describe('addCalculation', () => {
        it('should add a calculation', async () => {
            const partitionKey = 'partitionKey'
            const storedAt = 'storedAt'

            await addCalculation(partitionKey, storedAt)
            expect(mockWrite).toBeCalledTimes(1)
            expect(mockWrite.mock.calls[0][0]._items.length).toEqual(2)
        })
    })
})
