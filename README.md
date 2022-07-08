# Calculator app with AWS

A simple calculator application that works between AWS services with GitHub Actions for ci/cd.

## Requirements

Two functions app that work between each other

## Database Design

We require to store reference for the user calculation file.

Hash Key: userId
Range Key: timestamp || latest


reference: string
createdAt: string



## Functions

### Calculate
```
REQUEST: POST
VALIDATION: {
    firstNumber: string
    secondNumber: string
    userName: string
}
```

1. Calculate function checks for validity of input data of POST request.
2. Send a SQS Message to a CALCULATION_QUEUE name/queue url.
   

### Process calculation

1. A lambda that handles the SQS messages and sums the numbers up. 
2. Save results in S3 for specific user.
3. Stores reference to these results file in DynamoDB. 
   * Uses userId as PK and sortKey of either `timestamp` or `latest`
   * When creating a record, we will have to make 2 item updates:
     * Put: one item sortKey as timestamp
     * Put: one item sortKey as latest


### Get user calculation

1. We receive a `GET` request with `userId` as parameter.
2. Search dynamoDB acces for that userId. Get the reference to results.
3. Fetch results from S3 document, parse them and return response as JSON.