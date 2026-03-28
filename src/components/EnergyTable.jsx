export default function EnergyTable({ columns, data, emptyMessage = 'No records found' }) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length}>
                                <div className="empty-state">
                                    <div className="empty-state-icon">⚡</div>
                                    <div>{emptyMessage}</div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i}>
                                {columns.map((col) => (
                                    <td key={col.key}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
