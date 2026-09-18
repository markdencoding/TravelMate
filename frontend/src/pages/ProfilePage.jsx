import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="profile-page max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account information</p>
      </div>

      <div className="card p-8">
        <div className="profile-header mb-6">
          <div className="profile-avatar">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.full_name || 'Traveler'}</h2>
            <p className="text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="divider mb-6"></div>

        <div className="profile-info-grid">
          <div className="info-group">
            <span className="info-label">Full Name</span>
            <div className="info-value">{user?.full_name || 'N/A'}</div>
          </div>
          
          <div className="info-group">
            <span className="info-label">Email Address</span>
            <div className="info-value">{user?.email || 'N/A'}</div>
          </div>
        </div>

        <div className="profile-notice">
          <p className="text-sm text-muted flex gap-2 items-start">
            <span>ℹ️</span>
            <span>
              <strong className="block mb-1 text-text font-semibold">Read-Only Account</strong>
              Your profile information is currently managed by your identity provider. 
              Direct profile and password updates are disabled in this environment.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
