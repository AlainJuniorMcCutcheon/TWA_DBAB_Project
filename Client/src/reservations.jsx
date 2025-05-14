export default function Reservations({
  filteredReservations,
  filters,
  uniqueListingTitles,
  handleFilterChange,
  handleStatusChange
}) {
  return (
    <div className="reservation-manager">
      <h2>Your reservations</h2>
      
      <div className="filters-container">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select 
            name="status" 
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="All">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filter by Date</label>
          <div className="date-range">
            <span>Between</span>
            <input 
              type="date" 
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
            <span>and</span>
            <input 
              type="date" 
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Filter by Listing</label>
          <select 
            name="listingTitle" 
            value={filters.listingTitle}
            onChange={handleFilterChange}
          >
            <option value="All Listings">All Listings</option>
            {uniqueListingTitles.map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="reservations-list">
        {filteredReservations.length === 0 ? (
          <p>No reservations found matching your filters.</p>
        ) : (
          filteredReservations.map(reservation => (
            <div key={reservation._id} className="reservation-card">
              <h3>Reservation Details</h3>
              <div className="reservation-info">
                <p><strong>Host:</strong> {reservation.host}</p>
                <p><strong>Guest:</strong> {reservation.guest}</p>
                <p><strong>Listing:</strong> {reservation.listingTitle}</p>
                <p><strong>Check-In:</strong> {new Date(reservation.checkIn).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> {new Date(reservation.checkOut).toLocaleDateString()}</p>
                <p><strong>Guests:</strong> {reservation.guests}</p>
                <p><strong>Total Price:</strong> ${reservation.totalPrice.toFixed(2)}</p>
                
                {/* Status with dynamic styling */}
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`status ${reservation.status}`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1).toLowerCase()}
                  </span>
                </p>
              </div>
              
              {reservation.status === 'PENDING' && (
                <div className="reservation-actions">
                  <button 
                    onClick={() => handleStatusChange(reservation._id, 'CONFIRMED')}
                    className="confirm-button"
                  >
                    Confirm the reservation
                  </button>
                  <button 
                    onClick={() => handleStatusChange(reservation._id, 'CANCELLED')}
                    className="refuse-button"
                  >
                    Refuse the reservation
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
