/**
 * Replaces Halo variables in SQL with their corresponding values
 * @param sql - The SQL string containing variables
 * @param variables - Object containing variable values
 * @returns SQL with variables replaced
 */
export function replaceHaloVariables(
    sql: string, 
    variables: Record<string, string>
): string {
    let processedSql = sql;
    
    // Replace variables with their values if they're set
    if (variables.$agentid) {
        processedSql = processedSql.replace(/\$agentid/g, variables.$agentid);
    }
    if (variables.$siteid) {
        processedSql = processedSql.replace(/\$siteid/g, variables.$siteid);
    }
    if (variables.$clientid) {
        processedSql = processedSql.replace(/\$clientid/g, variables.$clientid);
    }
    
    return processedSql;
}

/**
 * Example usage and tests
 */
export const examples = {
    // Test SQL with variables
    testSql: "SELECT * FROM profiles WHERE agent_id = $agentid AND site_id = $siteid",
    
    // Test variables
    testVariables: {
        $agentid: "12345",
        $siteid: "67890",
        $clientid: "11111"
    },
    
    // Expected result
    expectedResult: "SELECT * FROM profiles WHERE agent_id = 12345 AND site_id = 67890"
};
