import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export default function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [hostListings, setHostListings] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    listing: 'All Listings',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
const fetchHostReservations = async () => {
  try {
    const response = await fetch(`http://localhost:5000/reservations/hosts`, {
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('API Response Data:', data); // Add this line
    
    if (!data.reservations) throw new Error('Invalid response format');

    const transformed = data.reservations.map(res => ({
      ...res,
      listingTitle: res.listing_title || 'Unknown Listing',
      checkIn: res.check_in,
      checkOut: res.check_out,
      totalPrice: res.total_price,
      host: res.host || 'Unknown Host'
    }));

    console.log('Transformed Reservations:', transformed); // Add this line
    setReservations(transformed);
    setFilteredReservations(transformed);
    setHostListings(data.listings || []);
  } catch (error) {
    console.error('Full error:', error); // More detailed error logging
    setError(error.message);
    if (error.message.includes('401')) {
      navigate('/login');
    }
  } finally {
    setIsLoading(false);
  }
};

    fetchHostReservations(); // Don't forget to call the function
  }, []); // <-- This closes the first useEffect

  useEffect(() => {
    const filtered = reservations.filter(reservation => {
      // Filter by status
      if (filters.status !== 'All' && reservation.status !== filters.status) {
        return false;
      }
      
      // Filter by listing
      if (filters.listing !== 'All Listings' && reservation.listingId !== filters.listing) {
        return false;
      }
      
      // Filter by date range
      if (filters.startDate && filters.endDate) {
        const checkInDate = new Date(reservation.check_in);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        
        if (checkInDate < startDate || checkInDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredReservations(filtered);
  }, [filters, reservations]);

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/status`, {
        method: 'PATCH',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation status');
      }

      // Update local state
      setReservations(prev => 
        prev.map(res => 
          res._id === reservationId ? { ...res, status: newStatus } : res
        )
      );
    } catch (error) {
      console.error('Error updating reservation:', error);
      setError(error.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/hosts/logout", {
        method: "POST",
        credentials: 'include'
      });
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Host Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Sign Out</button>
      </div>
      
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
              name="listing" 
              value={filters.listing}
              onChange={handleFilterChange}
            >
              <option value="All Listings">All Listings</option>
              {hostListings.map(listing => (
                <option key={listing._id} value={listing._id}>
                  {listing.title}
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
                  <p><strong>Listing:</strong> {reservation.listing_title}</p>
                  <p><strong>Check-In:</strong> {new Date(reservation.checkIn).toLocaleDateString()}</p>
                  <p><strong>Check-out:</strong> {new Date(reservation.checkOut).toLocaleDateString()}</p>
                  <p><strong>Guests:</strong> {reservation.guests}</p>
                  <p><strong>Total Price:</strong> ${reservation.totalPrice.toFixed(2)}</p>
                  <p><strong>Status:</strong> {reservation.status}</p>
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
    </div>
  );
}