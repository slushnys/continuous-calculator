import 'reflect-metadata'
import { Table, Attribute, Entity, TransformFromDynamo, TransformToDynamo } from '@typedorm/common'

import { BatchManager, createConnection, EntityManager, WriteBatch } from '@typedorm/core'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Type } from 'class-transformer'

export const calculationTable = new Table({
    name: 'dev-CalculationResultsTable',
    partitionKey: 'partitionKey',
    sortKey: 'sortKey',
})

export interface Calculation {
    partitionKey: string
    sortKey: string
    storedAt: string
    createdAt: string
}
@Entity({
    name: 'calculation',
    primaryKey: {
        partitionKey: '{{partitionKey}}',
        sortKey: '{{sortKey}}',
    },
})
export class Calculation {
    @Attribute()
    partitionKey: string

    @Attribute()
    sortKey: string

    @Type(() => Date)
    @TransformFromDynamo(({ value }) => new Date(value))
    @TransformToDynamo(({ value }: { value: Date }) => value.toISOString())
    @Attribute()
    createdAt: string

    @Attribute()
    storedAt: string
}

export type CalculationRepository = ReturnType<typeof makeCalculationRepository>
export const makeCalculationRepository = ({
    dynamoDbClient,
    connection,
}: {
    dynamoDbClient: DynamoDBClient
    connection: ReturnType<typeof createConnection>
}): {
    getCalculation: ReturnType<typeof makeGetCalculation>
    addCalculation: ReturnType<typeof makeAddCalculation>
} => {
    return {
        getCalculation: makeGetCalculation(connection),
        addCalculation: makeAddCalculation(connection),
    }
}

function makeGetCalculation({ entityManager }: { entityManager: EntityManager }) {
    return async (partitionKey: string, sortKey: string): Promise<Calculation | undefined> => {
        const calculation = await entityManager.findOne(Calculation, { partitionKey, sortKey })
        console.log('calculation stored', calculation)
        return calculation
    }
}

function makeAddCalculation({ batchManager }: { batchManager: BatchManager }) {
    return async function addCalculation(partitionKey: string, storedAt: string): Promise<void> {
        const batch = new WriteBatch()
        const now = new Date()
        batch.addCreateItem<Calculation>({
            partitionKey,
            sortKey: now.toISOString(),
            storedAt,
            createdAt: now.toISOString(),
        })
        batch.addCreateItem<Calculation>({ partitionKey, sortKey: 'latest', storedAt, createdAt: now.toISOString() })

        await batchManager.write(batch, {
            backoffMultiplicationFactor: 1.2,
            maxRetryAttempts: 3,
            requestsConcurrencyLimit: 2,
        })
    }
}
