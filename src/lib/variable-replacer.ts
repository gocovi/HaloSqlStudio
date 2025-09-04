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

    // Replace date variables with SQL-formatted dates (wrapped in quotes)
    if (variables["@startdate"]) {
        processedSql = processedSql.replace(
            /@startdate/g,
            `'${variables["@startdate"]}'`
        );
    }
    if (variables["@enddate"]) {
        processedSql = processedSql.replace(
            /@enddate/g,
            `'${variables["@enddate"]}'`
        );
    }

    return processedSql;
}

/**
 * Example usage and tests
 */
export const examples = {
    // Test SQL with variables
    testSql:
        "SELECT * FROM profiles WHERE agent_id = $agentid AND site_id = $siteid AND created_date >= @startdate AND created_date <= @enddate",

    // Test variables
    testVariables: {
        $agentid: "12345",
        $siteid: "67890",
        $clientid: "11111",
        "@startdate": "2025-01-01",
        "@enddate": "2025-01-31",
    },

    // Expected result
    expectedResult:
        "SELECT * FROM profiles WHERE agent_id = 12345 AND site_id = 67890 AND created_date >= '2025-01-01' AND created_date <= '2025-01-31'",
};
